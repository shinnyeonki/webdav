#include "PaintFrame.h"
#include "Button.h"
#include "CheckBox.h"
#include "ToolBar.h"
#include "PaintPanel.h"


PaintFrame::PaintFrame() {}
PaintFrame::PaintFrame(std::string title, int width, int height) : Frame(title, width, height)
{
	ComponentInit();
}

void PaintFrame::repaint(HDC dc)
{
	Container::repaint(dc);
}


void PaintFrame::ComponentInit()
{
	myToolBar_ = new ToolBar();
	myPanel_ = new PaintPanel();

	Button* RectB = new Button("사각형");
	Button* EllB = new Button("타원");
	Button* LineB = new Button("선분");
	CheckBox* GridB = new CheckBox("그리드");
	Button* GroupB = new Button("그룹화");

	RectB->setCommand(FIG_RECT);
	EllB->setCommand(FIG_ELL);
	LineB->setCommand(FIG_LINE);
	GridB->setCommand(CHECK_GRID);
	GroupB->setCommand(FIG_GROUP);

	myToolBar_->addComponent(RectB);
	myToolBar_->addComponent(EllB);
	myToolBar_->addComponent(LineB);
	myToolBar_->addComponent(GridB);
	myToolBar_->addComponent(GroupB);

	RectB->addActionListener(myPanel_);
	EllB->addActionListener(myPanel_);
	LineB->addActionListener(myPanel_);
	GridB->addActionListener(myPanel_);
	GroupB->addActionListener(myPanel_);

	myPanel_->addMouseListener(myPanel_);

	this->addComponent(myToolBar_);
	this->addComponent(myPanel_);

	myPanel_->setFrame(this);
}

//
//bool PaintFrame::eventHandler(ActionEvent e)
//{
//	if (Container::eventHandler(e))
//		return true;
//
//	if (e.isLButtonDownEvent())
//	{
//		start_ = e.getPoint();
//	}
//	else if(e.isLButtonUpEvent())
//	{
//		end_ = e.getPoint();
//		if (isGroupKeyDown)
//		{
//			makeGroup();
//		}
//		else if (e.isCtrlKeyDown())
//		{
//			Figure* movingFg = findFigure(start_);
//			if (movingFg)
//			{
//				movingFg->move(end_.x_ - start_.x_, end_.y_ - start_.y_);
//			}
//		}
//		else
//		{
//			if (isChecked)
//			{
//				setCheckBox();
//			}
//			setFigure();
//		}
//	}
//	invalidate();
//	return 0;
//}
//
//void PaintFrame::setFigure()
//{
//	switch (shapeType)
//	{
//	case FIG_RECT:
//	{
//		Figure * Rect= new MRectangle(start_, end_);
//		fg.push_back(Rect);
//		break;
//	}
//	case FIG_ELL:
//	{
//		Figure* Ell = new MEllipse(start_, end_);
//		fg.push_back(Ell);
//		break;
//	}
//	case FIG_LINE:
//	{
//		Figure* Line = new MLine(start_, end_);
//		fg.push_back(Line);
//		break;
//	}
//	case FIG_GROUP:
//	{
//		Figure* FGroup = new FigureGroup();
//		break;
//	}
//	default:
//		break;
//	}
//}
//
//void PaintFrame::repaint(HDC dc) 
//{
//	Frame::repaint(dc);
//	for (auto i : fg)
//	{
//		(i)->draw(hDC_);
//	}
//}
//
//
//void PaintFrame::actionPerformed(ActionEvent e)
//{
//	int type = e.getEventBtnType();
//	if (type < CHECK_GRID)
//	{
//		if (type == FIG_GROUP && e.isLButtonUpEvent())
//		{
//			setGrouped();
//		}
//		setShape(type);
//	}
//	else
//	{
//		setCheck(type);
//	}
//}
//
//
//void PaintFrame::setCheckBox()
//{
//	start_ = CheckGrid(start_, 20);
//	end_ = CheckGrid(end_, 20);
//}
//
//
//MPoint PaintFrame::CheckGrid(MPoint p,int size)
//{
//	return MPoint((p.x_ + 10) / size * size, (p.y_ + 10) / size * size);
//}

