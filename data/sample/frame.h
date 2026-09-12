#pragma once
#include "Windows.h"
#include <string>
#include <list>
#include "Misc.h"
#include "Container.h"

LRESULT CALLBACK WndProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam);
class ToolBar;
class Panel;
class Frame : public Container
{
protected:
	// Window 프로그래밍을 위한 기본 변수들이다. 건드리지 않는다.
	HINSTANCE hInst_;
	HWND hWnd_;	 // 윈도 핸들을 저장해둔다.
	HDC hDC_;    // 이 변수가 있어야 그림을 그릴 수 있다.
	
public:
	Frame();
	Frame(std::string, int, int);
	void invalidate();
	HDC getHDC();
	virtual void run();
};